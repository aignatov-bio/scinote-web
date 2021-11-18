# frozen_string_literal: true

module Reports::Docx::DrawMyModule
  def draw_my_module(subject)
    color = @color
    link_style = @link_style
    scinote_url = @scinote_url
    my_module = subject.my_module
    tags = my_module.tags
    return unless can_read_my_module?(@user, my_module)

    @docx.h3 my_module.name, italic: false, size: Constants::REPORT_DOCX_MY_MODULE_TITLE_SIZE
    @docx.p do
      text I18n.t('projects.reports.elements.module.user_time',
                  timestamp: I18n.l(my_module.created_at, format: :full)), color: color[:gray]
      if my_module.archived?
        text ' | '
        text I18n.t('search.index.archived'), color: color[:gray]
      end
      text ' | '
      link  I18n.t('projects.reports.elements.all.scinote_link'),
            scinote_url + Rails.application.routes.url_helpers.protocols_my_module_path(my_module),
            link_style
    end

    @docx.p do
      if my_module.started_on.present?
        text I18n.t('projects.reports.elements.module.started_on',
                    started_on: I18n.l(my_module.started_on, format: :full))
      else
        text I18n.t('projects.reports.elements.module.no_due_date')
      end
    end

    @docx.p do
      if my_module.due_date.present?
        text I18n.t('projects.reports.elements.module.due_date',
                    due_date: I18n.l(my_module.due_date, format: :full))
      else
        text I18n.t('projects.reports.elements.module.no_due_date')
      end
    end

    status = my_module.my_module_status
    @docx.p do
      text I18n.t('projects.reports.elements.module.status')
      text ' '
      text "[#{status.name}]", color: status.color.delete('#')
      if my_module.completed?
        text " #{I18n.t('my_modules.states.completed')} #{I18n.l(my_module.completed_on, format: :full)}"
      end
    end

    @docx.p do
      text I18n.t('projects.reports.elements.module.tags_header')
      if tags.any?
        my_module.tags.each do |tag|
          text ' '
          text "[#{tag.name}]", color: tag.color.delete('#')
        end
      else
        text ' '
        text I18n.t('projects.reports.elements.module.no_tags')
      end
    end

    if my_module.description.present?
      html = custom_auto_link(my_module.description, team: @report_team)
      Reports::HtmlToWordConverter.new(@docx, { scinote_url: scinote_url,
                                                link_style: link_style }).html_to_word_converter(html)
    else
      @docx.p I18n.t('projects.reports.elements.module.no_description')
    end

    draw_my_module_protocol(my_module) if @settings.dig('task', 'protocol', 'description')

    filter_steps_for_report(my_module.protocol.steps, @settings).order(:position).each do |step|
      draw_step(step)
    end

    order_results_for_report(my_module.results, @settings.dig('task', 'result_order')).each do |result|
      if result.is_asset && @settings.dig('task', 'file_results')
        draw_result_asset(result)
      elsif result.is_table && @settings.dig('task', 'table_results')
        draw_result_table(result)
      elsif result.is_text && @settings.dig('task', 'text_results')
        draw_result_text(result)
      end
    end

    @docx.p
    subject.children.active.each do |child|
      public_send("draw_#{child.type_of}", child)
    end

    draw_my_module_activity(my_module) if @settings.dig('task', 'activities')
  end
end
