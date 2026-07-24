"use client";

import { PlusIcon, RefreshCwIcon, ShieldIcon, UserCogIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  stateLabel,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { ChangeMemberRoleDialog } from "@/components/admin/dialogs/change-member-role-dialog";
import { ChangeUserStateDialog } from "@/components/admin/dialogs/change-user-state-dialog";
import { CreateSubAdminDialog } from "@/components/admin/dialogs/create-sub-admin-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "state",
    label: "State",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Blocked", value: "BLOCKED" },
    ],
  },
];

function mapMember(member: ApiRecord): AdminRow {
  return {
    Member: field(member, ["name", "email", "user_id"]),
    Role: field(member, ["assigned_role", "role_id"]),
    State: stateLabel(member.state),
    Phone: field(member, ["phone"]),
    Created: formatDate(member.created_at),
  };
}

function MemberRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const userId = field(item, ["user_id", "_id"]);
  const label = field(item, ["name", "email", "user_id"]);

  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_ADMIN_USER_ROLE_ASSIGN">
        <ChangeMemberRoleDialog
          userId={userId}
          userLabel={label}
          currentRole={field(item, ["assigned_role", "role_id"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Change role">
              <ShieldIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_USER_STATE_CHANGE">
        <ChangeUserStateDialog
          userId={userId}
          currentState={field(item, ["state"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Change state">
              <UserCogIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function InternalTeamPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["members", "users"]}
      columns={["Member", "Role", "State", "Phone", "Created"]}
      description="Internal team accounts and sub-admins. A member's role decides which parts of the console they can reach."
      emptyMessage="No internal team members returned by the backend."
      endpoint="/api/admin/internal-team"
      eyebrow="Internal access"
      filters={FILTERS}
      mapRow={mapMember}
      metrics={(data, rows) => [
        {
          label: "Team members",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Active",
          value: formatNumber(countRows(rows, "State", /ACTIVE/i)),
          detail: "Loaded active members",
        },
        {
          label: "Blocked",
          value: formatNumber(countRows(rows, "State", /BLOCKED/i)),
          detail: "Loaded blocked members",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible rows" },
      ]}
      paginated
      primaryAction={(refresh) => (
        <Gated power="PWR_ADMIN_USER_ROLE_ASSIGN">
          <CreateSubAdminDialog
            refresh={refresh}
            trigger={
              <Button>
                <PlusIcon />
                New sub-admin
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <MemberRowActions item={item} refresh={refresh} />}
      title="Internal Team"
      variant="people"
    />
  );
}
