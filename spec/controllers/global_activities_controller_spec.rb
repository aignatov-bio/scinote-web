# frozen_string_literal: true

require 'rails_helper'

describe GlobalActivitiesController, type: :controller do
  login_user(true)
  render_views
  let(:user) { User.first }

  describe 'Methods' do
    describe '#search_subject' do
      let(:project) { create :project, team: user.teams.first }
      let(:experiment) { create :experiment_with_tasks, project: project }

      it 'have right output format' do
        experiment
        get :search_subjects, format: :json
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body).to include('Project', 'Experiment', 'MyModule', 'Protocol')
      end

      it 'return value without query' do
        experiment
        params = {}
        get :search_subjects, format: :json, params: params
        element_count = JSON.parse(response.body).map { |_k, v| v.length }.sum
        expect(element_count).to eq 8
      end

      it 'return specific values with query' do
        experiment
        params = { query: 'Task' }
        get :search_subjects, format: :json, params: params
        element_count = JSON.parse(response.body).map { |_k, v| v.length }.sum
        expect(element_count).to eq 3
      end
    end
  end
