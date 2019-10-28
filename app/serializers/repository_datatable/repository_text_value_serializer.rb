# frozen_string_literal: true

module RepositoryDatatable
  class RepositoryTextValueSerializer < ActiveModel::Serializer
    attributes :data, :value_type

    def data
      object.value.data
    end
  end
end