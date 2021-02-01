# frozen_string_literal: true

class StepCreateJob < ApplicationJob
  queue_as :high_priority

  def perform(step)
    ProtocolChannel.broadcast_to(step.protocol,{
      action: 'create',
      data: step
    })
  end
end
