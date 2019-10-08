# frozen_string_literal: true

module RepositoryColumns
  class CreateDateColumnService < CreateColumnService
    def initialize(user, repository_id, name)
      super(user, repository_id, name)
    end

    def call
      return self unless valid?

      ActiveRecord::Base.transaction do
        create_base_column(Extends::REPOSITORY_DATA_TYPES[:RepositoryDateValue])

        # TODO
      end

      self
    end
  end
end