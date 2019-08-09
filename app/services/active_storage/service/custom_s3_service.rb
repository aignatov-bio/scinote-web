# frozen_string_literal: true

# Copyright (c) 2017-2019 David Heinemeier Hansson, Basecamp
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
# LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

require 'aws-sdk-s3'
require 'active_support/core_ext/numeric/bytes'

module ActiveStorage
  # Wraps the Amazon Simple Storage Service (S3) as an Active Storage service.
  # See ActiveStorage::Service for the generic API documentation that applies to all services.
  class Service::CustomS3Service < Service
    attr_reader :client, :bucket
    attr_reader :multipart_upload_threshold, :upload_options
    attr_reader :subfolder

    def initialize(bucket:, upload: {}, **options)
      @subfolder = options.delete(:subfolder)

      @client = Aws::S3::Resource.new(**options)
      @bucket = @client.bucket(bucket)

      @multipart_upload_threshold = upload.fetch(:multipart_threshold, 100.megabytes)
      @upload_options = upload
    end

    def upload(key, io, checksum: nil, content_type: nil, **)
      instrument :upload, key: key, checksum: checksum do
        if io.size < multipart_upload_threshold
          upload_with_single_part key, io, checksum: checksum, content_type: content_type
        else
          upload_with_multipart key, io, content_type: content_type
        end
      end
    end

    def download(key, &block)
      if block_given?
        instrument :streaming_download, key: key do
          stream(key, &block)
        end
      else
        instrument :download, key: key do
          object_for(key).get.body.string.force_encoding(Encoding::BINARY)
        end
      end
    end

    def download_chunk(key, range)
      instrument :download_chunk, key: key, range: range do
        object_for(key).get(range: "bytes=#{range.begin}-#{range.exclude_end? ? range.end - 1 : range.end}")
                       .body
                       .string
                       .force_encoding(Encoding::BINARY)
      end
    end

    def delete(key)
      instrument :delete, key: key do
        object_for(key).delete
      end
    end

    def delete_prefixed(prefix)
      instrument :delete_prefixed, prefix: prefix do
        prefix = subfolder.present? ? File.join(subfolder, prefix) : prefix
        bucket.objects(prefix: prefix).batch_delete!
      end
    end

    def exist?(key)
      instrument :exist, key: key do |payload|
        answer = object_for(key).exists?
        payload[:exist] = answer
        answer
      end
    end

    def url(key, expires_in:, filename:, disposition:, content_type:)
      instrument :url, key: key do |payload|
        generated_url = object_for(key).presigned_url :get, expires_in: expires_in.to_i,
          response_content_disposition: content_disposition_with(type: disposition, filename: filename),
          response_content_type: content_type

        payload[:url] = generated_url

        generated_url
      end
    end

    def url_for_direct_upload(key, expires_in:, content_type:, content_length:, checksum:)
      raise ActiveStorage::IntegrityError if content_length > Rails.configuration.x.file_max_size_mb.megabytes

      instrument :url, key: key do |payload|
        generated_url = object_for(key).presigned_url :put, expires_in: expires_in.to_i,
          content_type: content_type, content_length: content_length, content_md5: checksum

        payload[:url] = generated_url

        generated_url
      end
    end

    def headers_for_direct_upload(_key, content_type:, checksum:, **)
      { 'Content-Type' => content_type, 'Content-MD5' => checksum }
    end

    private

    MAXIMUM_UPLOAD_PARTS_COUNT = 10000
    MINIMUM_UPLOAD_PART_SIZE   = 5.megabytes

    def upload_with_single_part(key, io, checksum: nil, content_type: nil)
      object_for(key).put(body: io, content_md5: checksum, content_type: content_type, **upload_options)
    rescue Aws::S3::Errors::BadDigest
      raise ActiveStorage::IntegrityError
    end

    def upload_with_multipart(key, io, content_type: nil)
      part_size = [io.size.fdiv(MAXIMUM_UPLOAD_PARTS_COUNT).ceil, MINIMUM_UPLOAD_PART_SIZE].max

      object_for(key).upload_stream(content_type: content_type, part_size: part_size, **upload_options) do |out|
        IO.copy_stream(io, out)
      end
    end

    def object_for(key)
      key = subfolder.present? ? File.join(subfolder, key) : key
      bucket.object(key)
    end

    # Reads the object for the given key in chunks, yielding each to the block.
    def stream(key)
      object = object_for(key)

      chunk_size = 5.megabytes
      offset = 0

      while offset < object.content_length
        yield object.get(range: "bytes=#{offset}-#{offset + chunk_size - 1}")
                    .body
                    .string
                    .force_encoding(Encoding::BINARY)
        offset += chunk_size
      end
    end
  end

  module S3SignerModifier
    def build_signer(cfg)
      signer = super(cfg)
      signer.unsigned_headers.delete('content-length')
      signer
    end
  end

  Aws::S3::Presigner.class_eval do
    prepend S3SignerModifier
  end
end
