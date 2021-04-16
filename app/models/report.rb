# frozen_string_literal: true

class Report < ApplicationRecord
  include SettingsModel
  include SearchableModel
  include SearchableByNameModel

  # ActiveStorage configuration
  has_one_attached :pdf_file
  has_one_attached :docx_file

  auto_strip_attributes :name, :description, nullify: false
  validates :name,
            length: { minimum: Constants::NAME_MIN_LENGTH,
                      maximum: Constants::NAME_MAX_LENGTH },
            uniqueness: { scope: %i(user_id project_id), case_sensitive: false }
  validates :description, length: { maximum: Constants::TEXT_MAX_LENGTH }
  validates :project, presence: true
  validates :user, presence: true

  belongs_to :project, inverse_of: :reports
  belongs_to :user, inverse_of: :reports
  belongs_to :team, inverse_of: :reports
  belongs_to :last_modified_by,
             foreign_key: 'last_modified_by_id',
             class_name: 'User',
             optional: true
  has_many :report_template_values, dependent: :destroy

  # Report either has many report elements (if grouped by timestamp),
  # or many module elements (if grouped by module)
  has_many :report_elements, inverse_of: :report, dependent: :delete_all

  DEFAULT_SETTINGS = {
    all_tasks: true,
    task: {
      protocol: {
        description: true,
        completed_steps: true,
        uncompleted_steps: true,
        step_checklists: true,
        step_files: true,
        step_tables: true,
        step_comments: true
      },
      file_results: false,
      file_results_previews: false,
      table_results: true,
      text_results: true,
      result_comments: true,
      result_order: 'atoz',
      activities: true
    }
  }.freeze

  def self.search(
    user,
    include_archived,
    query = nil,
    page = 1,
    _current_team = nil,
    options = {}
  )

    project_ids =
      Project
      .search(user, include_archived, nil, Constants::SEARCH_NO_LIMIT)
      .pluck(:id)

    new_query =
      Report
      .distinct
      .where('reports.project_id IN (?)', project_ids)
      .where_attributes_like(%i(name description), query, options)

    # Show all results if needed
    if page == Constants::SEARCH_NO_LIMIT
      new_query
    else
      new_query
        .limit(Constants::SEARCH_LIMIT)
        .offset((page - 1) * Constants::SEARCH_LIMIT)
    end
  end

  def self.viewable_by_user(user, teams)
    where(project: Project.viewable_by_user(user, teams))
  end

  def root_elements
    report_elements.order(:position).select { |el| el.parent.blank? }
  end

  # Save the JSON represented contents to this report
  # (this action will overwrite any existing report elements)
  def save_with_contents(json_contents, template_values)
    begin
      Report.transaction do
        # First, save the report itself
        save!

        # Secondly, delete existing report elements
        report_elements.destroy_all

        # Lastly, iterate through contents
        json_contents.each_with_index do |json_el, i|
          save_json_element(json_el, i, nil)
        end

        report_template_values.destroy_all

        formatted_template_values = template_values.as_json.map { |k, v| v['name'] = k; v }
        report_template_values.create!(formatted_template_values)
      end
    rescue ActiveRecord::ActiveRecordError, ArgumentError
      return false
    end
    true
  end

  # Clean report elements from report
  # the function runs before the report is edit
  def cleanup_report
    report_elements.each(&:clean_removed_or_archived_elements)
  end

  def self.generate_whole_project_report(project, current_user, current_team)
    report_contents = gen_element_content(project, Extends::EXPORT_ALL_PROJECT_ELEMENTS)

    report = Report.new
    report.name = loop do
      dummy_name = SecureRandom.hex(10)
      break dummy_name unless Report.where(name: dummy_name).exists?
    end
    report.project = project
    report.user = current_user
    report.team = current_team
    report.last_modified_by = current_user
    report.save_with_contents(report_contents)
    report
  end

  def self.gen_element_content(parent, children)
    elements = []

    children.each do |element|
      element_hash = lambda { |object|
        hash_object = {
          'type_of' => element[:type_of] || element[:type_of_lambda].call(object),
          'id' => { element[:id_key] => object.id },
          'sort_order' => element[:sort_order],
          'children' => gen_element_content(object, element[:children] || [])
        }
        hash_object['id'][element[:parent_id_key]] = parent.id if element[:parent_id_key]
        hash_object
      }

      if element[:relation]
        (element[:relation].inject(parent) { |p, method| p.public_send(method) }).each do |child|
          elements.push(element_hash.call(child))
        end
      else
        elements.push(element_hash.call(parent))
      end
    end
    elements
  end

  private

  # Recursively save a single JSON element
  def save_json_element(json_element, index, parent)
    el = ReportElement.new
    el.position = index
    el.report = self
    el.parent = parent
    el.type_of = json_element['type_of']
    el.sort_order = json_element['sort_order']
    el.set_element_references(json_element['id'])
    el.save!

    if json_element['children'].present?
      json_element['children'].each_with_index do |child, i|
        save_json_element(child, i, el)
      end
    end
  end
end
