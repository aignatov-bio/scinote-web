module PermissionHelpers
  def create_user_assignment(object, role, user, assigned_by = nil)
    create :user_assignment,
           assignable: object,
           user: user,
           user_role: role,
           assigned_by: assigned_by || user

    case object
    when MyModule
      create_user_assignment(object.experiment, role, user, assigned_by)
    when Experiment
      create_user_assignment(object.project, role, user, assigned_by)
    end
  end
end
