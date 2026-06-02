"use client";

import { PlusIcon, RefreshCwIcon, UserMinusIcon } from "lucide-react";

import {
  ApiAdminPage,
  field,
  formatNumber,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { AssignRoleDialog } from "@/components/admin/dialogs/assign-role-dialog";
import { RevokeRoleDialog } from "@/components/admin/dialogs/revoke-role-dialog";

function mapAssignableRole(role: ApiRecord): AdminRow {
  const powers = Array.isArray(role.powers) ? role.powers.length : 0;
  return {
    Role: field(role, ["role_name", "role_id"]),
    Scope: role.is_system_role ? "System role" : "Custom role",
    Powers: formatNumber(powers),
    Endpoint: "/api/admin/rbac/assign-role",
    Revoke: "/api/admin/rbac/revoke-role",
  };
}

function RoleAssignmentRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const roleId = field(item, ["role_id", "_id"]);
  return (
    <div className="flex items-center justify-end gap-1">
      <Gated allOf={["PWR_ADMIN_ROLE_MANAGE", "PWR_ADMIN_USER_ROLE_ASSIGN"]}>
        <RevokeRoleDialog roleId={roleId} roleName={field(item, ["role_name"])} refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Revoke">
              <UserMinusIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function RoleAssignmentsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["roles"]}
      columns={["Role", "Scope", "Powers", "Endpoint", "Revoke"]}
      description="Assignable role catalog from RBAC. Assign and revoke roles from user accounts."
      emptyMessage="No assignable roles returned by the backend."
      endpoint="/api/admin/rbac/roles"
      eyebrow="RBAC"
      mapRow={mapAssignableRole}
      metrics={(data, rows) => [
        { label: "Assignable roles", value: formatNumber(data.total ?? rows.length), detail: "Roles available for assignment" },
        { label: "Assign route", value: "POST", detail: "/api/admin/rbac/assign-role" },
        { label: "Revoke route", value: "POST", detail: "/api/admin/rbac/revoke-role" },
        { label: "Gap", value: "No list API", detail: "Backend can add assignment history later" },
      ]}
      primaryAction={(refresh) => (
        <Gated allOf={["PWR_ADMIN_ROLE_MANAGE", "PWR_ADMIN_USER_ROLE_ASSIGN"]}>
          <AssignRoleDialog refresh={refresh}
            trigger={
              <Button>
                <PlusIcon />
                Assign role
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <RoleAssignmentRowActions item={item} refresh={refresh} />}
      title="Role Assignments"
      variant="access"
    />
  );
}
