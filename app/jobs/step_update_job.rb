# frozen_string_literal: true

class StepUpdateJob < ApplicationJob
  queue_as :high_priority

  def perform(current_user, step)
    StepChannel.broadcast_to(current_user, step)
  end
end
