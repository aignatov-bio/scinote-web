module ControllerMacros
  def login_user(team=false)
    before(:each) do
      @request.env['devise.mapping'] = Devise.mappings[:user]
      user = create :user
      if team
        team = create :team
        user.update(current_team_id: team.id)
        create :user_team, user:user, team:team
      end
      user.confirm
      sign_in user
    end
  end
end
