class GlobalActivitiesController < ApplicationController
  before_action :set_placeholder_variables, only: [:index]

  include BootstrapFormHelper

  def index
  end

  def test_query
    render json: {"Project":[{"id":3,"name":"Demo project - qPCR"},{"id":24,"name":"Demo project - qPCR (1)"},{"id":25,"name":"Demo project - qPCR (2)"},{"id":26,"name":"Demo project - qPCR (3)"},{"id":27,"name":"Demo project - qPCR (4)"},{"id":28,"name":"Demo project - qPCR (5)"},{"id":30,"name":"Demo project - qPCR (6)"},{"id":31,"name":"Demo project - qPCR (7)"},{"id":32,"name":"Demo project - qPCR (8)"},{"id":47,"name":"Demo project - qPCR (9)"},{"id":48,"name":"Demo project - qPCR (10)"},{"id":52,"name":"Demo project - qPCR (11)"},{"id":53,"name":"Demo project - qPCR (12)"},{"id":54,"name":"Demo project - qPCR (13)"},{"id":55,"name":"Demo project - qPCR (14)"},{"id":56,"name":"Demo project - qPCR (15)"},{"id":57,"name":"Demo project - qPCR (16)"},{"id":58,"name":"Demo project - qPCR (17)"},{"id":59,"name":"Demo project - qPCR (18)"},{"id":60,"name":"Demo project - qPCR (19)"}],"Step":[{"id":7021,"name":"Demo step"}]}
  end

  private

  # Whoever will be implementig the filters
  # will delete this method and before action
  def set_placeholder_variables
    @teams = current_user.teams.teams_select
    @activity_types = Activity.activity_types_list
    @users = UserTeam.my_employees(current_user)
  end
end
