# frozen_string_literal: true

class RepositoryDateTimeRangeValueBase < ApplicationRecord
  self.table_name = 'repository_date_time_range_values'

  belongs_to :created_by, foreign_key: :created_by_id, class_name: 'User', optional: true,
             inverse_of: :created_repository_date_time_values
  belongs_to :last_modified_by, foreign_key: :last_modified_by_id, class_name: 'User', optional: true,
             inverse_of: :modified_repository_date_time_values
  has_one :repository_cell, as: :value, dependent: :destroy, inverse_of: :repository_date_time_value
  accepts_nested_attributes_for :repository_cell

  validates :repository_cell, :start_time, :end_time, presence: true

  SORTABLE_COLUMN_NAME = 'repository_date_time_values.start_time'
  SORTABLE_VALUE_INCLUDE = :repository_date_time_range_value

  def update_data!(new_data, user)
    self.start_time = Time.zone.parse(new_data[:start_time])
    self.end_time = Time.zone.parse(new_data[:end_time])
    self.last_modified_by = user
    save!
  end

  def data
    [start_time, end_time].compact.join(' - ')
  end

  private

  def formatted(format)
    [
      I18n.l(start_time, format: format),
      I18n.l(end_time, format: format)
    ].compact.join(' - ')
  end
end