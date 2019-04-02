# frozen_string_literal: true

class GlobalActivitiesController < ApplicationController
  def index
    @teams = current_user.teams
    selected_teams = if request.format.html?
                       current_team
                     elsif activity_filters[:teams].present?
                       @teams.where(id: activity_filters[:teams]).order(name: :asc)
                     else
                       @teams.order(name: :asc)
                     end
    @activity_types = Activity.activity_types_list
    @user_list = User.where(id: UserTeam.where(team: current_user.teams).select(:user_id))
                     .distinct
                     .order(full_name: :asc)
                     .pluck(:full_name, :id)
    @grouped_activities, @more_activities =
      ActivitiesService.load_activities(current_user, selected_teams, activity_filters)
    last_day = @grouped_activities.keys.last
    @next_date = (Date.parse(last_day) - 1.day).strftime('%Y-%m-%d') if last_day
    respond_to do |format|
      format.json do
        render json: {
          activities_html: render_to_string(
            partial: 'activity_list.html.erb'
          ),
          from: @next_date,
          more_activities: @more_activities
        }
      end
      format.html do
      end
    end
  end

  def search_subjects
    query = subject_search_params[:query]
    teams =
      if subject_search_params[:teams].present?
        current_user.teams.where(id: subject_search_params[:teams])
      else
        current_user.teams
      end
    subject_types =
      if subject_search_params[:subject_types].present?
        Extends::SEARCHABLE_ACTIVITY_SUBJECT_TYPES &
          subject_search_params[:subject_types]
      else
        Extends::SEARCHABLE_ACTIVITY_SUBJECT_TYPES
      end
    results = {}
    subject_types.each do |subject|
      matched = subject.constantize
                       .search_by_name(current_user, teams, query, whole_phrase: true)
                       .limit(Constants::SEARCH_LIMIT)
                       .pluck(:id, :name)
      next if matched.length.zero?

      results[subject] = matched.map { |pr| { id: pr[0], name: pr[1] } }
    end
    respond_to do |format|
      format.json do
        render json: results
      end
    end
  end

  private

  def activity_filters
    params.permit(
      :from_date, :to_date, types: [], subjects: {}, users: [], teams: []
    )
  end

  def subject_search_params
    params.permit(:query, teams: [], subject_types: [])
  end
end
