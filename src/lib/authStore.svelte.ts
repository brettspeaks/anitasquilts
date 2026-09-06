import type { UserProfile, Workspace, UserRole } from './types';

const DEFAULT_WORKSPACES: Workspace[] = [
	{
		id: 'ws-anita-main',
		name: "Anita's Underground Vault",
		slug: 'anitas-vault',
		role: 'admin',
		member_count: 6
	},
	{
		id: 'ws-live-crew',
		name: 'Live Audio & Sound Crew',
		slug: 'live-crew',
		role: 'curator',
		member_count: 14
	},
	{
		id: 'ws-global-scouts',
		name: 'Underground Scouts Network',
		slug: 'underground-scouts',
		role: 'viewer',
		member_count: 42
	}
];

const DEFAULT_USER: UserProfile = {
	id: 'usr-anita-001',
	email: 'anita@underground.ai',
	name: 'Anita S.',
	avatar_url: '',
	role: 'admin',
	active_workspace_id: 'ws-anita-main'
};

class AuthState {
	user = $state<UserProfile | null>(DEFAULT_USER);
	workspaces = $state<Workspace[]>(DEFAULT_WORKSPACES);
	activeWorkspaceId = $state<string>('ws-anita-main');
	isAuthenticated = $state<boolean>(true);

	// Derived active workspace
	get activeWorkspace(): Workspace {
		return (
			this.workspaces.find((w) => w.id === this.activeWorkspaceId) ||
			this.workspaces[0]
		);
	}

	get activeRole(): UserRole {
		return this.user?.role || 'viewer';
	}

	get canIngest(): boolean {
		return this.activeRole === 'curator' || this.activeRole === 'admin';
	}

	get canPublishPublic(): boolean {
		return this.activeRole === 'admin' || this.activeRole === 'curator';
	}

	get canManageTeam(): boolean {
		return this.activeRole === 'admin';
	}

	switchWorkspace(workspaceId: string) {
		const ws = this.workspaces.find((w) => w.id === workspaceId);
		if (ws) {
			this.activeWorkspaceId = workspaceId;
			if (this.user) {
				this.user.active_workspace_id = workspaceId;
				this.user.role = ws.role;
			}
		}
	}

	switchRole(newRole: UserRole) {
		if (this.user) {
			this.user.role = newRole;
			const currentWs = this.workspaces.find((w) => w.id === this.activeWorkspaceId);
			if (currentWs) {
				currentWs.role = newRole;
			}
		}
	}

	login(email: string, name = 'Anita S.', role: UserRole = 'admin') {
		this.user = {
			id: 'usr-' + Math.random().toString(36).substring(2, 9),
			email,
			name,
			role,
			active_workspace_id: this.activeWorkspaceId
		};
		this.isAuthenticated = true;
	}

	register(name: string, email: string) {
		this.login(email, name, 'curator');
	}

	logout() {
		this.user = null;
		this.isAuthenticated = false;
	}

	updateProfile(name: string, email: string) {
		if (this.user) {
			this.user.name = name;
			this.user.email = email;
		}
	}

	createWorkspace(name: string): Workspace {
		const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
		const newWs: Workspace = {
			id: 'ws-' + Math.random().toString(36).substring(2, 9),
			name,
			slug,
			role: 'admin',
			member_count: 1
		};
		this.workspaces.push(newWs);
		this.switchWorkspace(newWs.id);
		return newWs;
	}
}

export const authState = new AuthState();
