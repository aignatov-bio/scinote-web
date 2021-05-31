# frozen_string_literal: true

module Api
  module V1
    class ProjectUserAssignmentsController < BaseController
      before_action :load_team
      before_action :load_project
      before_action :load_user_assignment, only: %i(show update destroy)
      before_action :load_user_project_for_managing, only: %i(show update destroy)

      def index
        user_assignments = @project.user_assignments
                                   .includes(:user_role)
                                   .page(params.dig(:page, :number))
                                   .per(params.dig(:page, :size))

        render jsonapi: user_assignments,
               each_serializer: ProjectUserAssignmentSerializer,
               include: %i(user user_role)
      end

      def show
        render jsonapi: @user_assignment,
               serializer: ProjectUserAssignmentSerializer,
               include: %i(user user_role)
      end

      def create
        raise PermissionError.new(Project, :manage) unless can_manage_project?(@project)

        # internally we reuse the same logic as for user project assignment
        user = @team.users.find(user_project_params[:user_id])

        project_member = ProjectMember.new(user, @project, current_user)
        project_member.assign = true
        project_member.user_role_id = user_project_params[:user_role_id]
        project_member.create

        render jsonapi: project_member.user_assignment.reload,
               serializer: ProjectUserAssignmentSerializer,
               status: :created
      end

      def update
        user_role = UserRole.find user_project_params[:user_role_id]
        project_member = ProjectMember.new(@user_assignment.user, @project, current_user)

        if project_member.user_assignment&.user_role == user_role
          return render body: nil, status: :no_content
        end

        project_member.user_role_id = user_role.id
        project_member.update
        render jsonapi: @user_assignment.reload, serializer: ProjectUserAssignmentSerializer, status: :ok
      end

      def destroy
        project_member = ProjectMember.new(@user_assignment.user, @project, current_user)
        project_member.destroy
        render body: nil
      end

      private

      def load_user_assignment
        @user_assignment = @project.user_assignments.find(params.require(:id))
      end

      def load_user_project_for_managing
        raise PermissionError.new(Project, :manage) unless can_manage_project?(@project)
      end

      def user_project_params
        raise TypeError unless params.require(:data).require(:type) == 'project_user_assignments'

        params.require(:data).require(:attributes).permit(:user_id, :user_role_id)
      end
    end
  end
end
