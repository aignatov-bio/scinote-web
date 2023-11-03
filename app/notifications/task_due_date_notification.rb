# frozen_string_literal: true

class TaskDueDateNotification < BaseNotification
  def message
    I18n.t(
      'notifications.notification.my_module_due_date_reminder_html',
      my_module_name: subject.name
    )
  end

  def self.subtype
    :my_module_due_date_reminder
  end

  def title; end

  def subject
    MyModule.find(params[:my_module_id])
  end

  after_deliver do
    MyModule.find(params[:my_module_id]).update(due_date_notification_sent: true)
  end
end
