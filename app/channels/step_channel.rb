class StepChannel < ApplicationCable::Channel
  def subscribed
    step = Step.find(params[:id])
    stream_for step
  end
end
