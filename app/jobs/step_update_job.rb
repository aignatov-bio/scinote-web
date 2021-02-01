# frozen_string_literal: true

class StepUpdateJob < ApplicationJob
  queue_as :high_priority

  def perform(step)
    StepChannel.broadcast_to(step, step)
  end
end
