class StepChannel < ApplicationCable::Channel
  def subscribed
    stream_for Step.find(params[:id])
  end
end
