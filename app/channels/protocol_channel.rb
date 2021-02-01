class ProtocolChannel < ApplicationCable::Channel
  def subscribed
    stream_for Protocol.find(params[:id])
  end
end
