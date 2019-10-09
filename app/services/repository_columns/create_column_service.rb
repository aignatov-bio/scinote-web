# frozen_string_literal: true

module RepositoryColumns
<<<<<<< HEAD
  class CreateColumnService < RepositoryColumns::ColumnService
    def initialize(user:, repository:, params:, team:, column_type:)
      super(user: user, repository: repository, team: team, column_name: params[:name])
      @column_type = column_type
      @params = params
    end

    def call
      return self unless valid?

      @column = RepositoryColumn.new(column_attributes)

      if @column.save
        log_activity(:create_column_inventory)
      else
        errors[:repository_column] = @column.errors.messages
      end

      self
=======
  class CreateColumnService
    extend Service
    include Canaid::Helpers::PermissionsHelper

    attr_reader :errors

    def initialize(user, repository, name)
      @user = user
      @repository = repository
      @name = name
      @errors = {}
    end

    def call
      raise NotImplementedError
    end

    def succeed?
      @errors.none?
>>>>>>> Add create repository column service
    end

    private

<<<<<<< HEAD
    def column_attributes
      @params[:repository_status_items_attributes]&.map do |m|
        m.merge!(repository_id: @repository.id, created_by_id: @user.id, last_modified_by_id: @user.id)
      end

      @params[:repository_list_items_attributes]&.map do |m|
        m.merge!(repository_id: @repository.id, created_by_id: @user.id, last_modified_by_id: @user.id)
      end

      @params.merge(repository_id: @repository.id, created_by_id: @user.id, data_type: @column_type)
=======
    def valid?
      unless @user && @repository
        @errors[:invalid_arguments] =
          { 'user': @user,
            'repository': @repository }
          .map do |key, value|
            "Can't find #{key.capitalize}" if value.nil?
          end.compact
      end

      @errors[:user_without_permissions] = :forbidden unless can_create_repository_columns?(@user, @repository)

      succeed?
    end

    def create_base_column(type)
      @column = RepositoryColumn.new(
        repository_id: @repository_id,
        created_by: @user,
        name: @name,
        data_type: type
      )
>>>>>>> Add create repository column service
    end
  end
end
