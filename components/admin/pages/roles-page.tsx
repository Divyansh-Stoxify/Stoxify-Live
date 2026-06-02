"use client";

import { PencilIcon, PlusIcon, RefreshCwIcon, UserMinusIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatNumber,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { CreateEditRoleDialog } from "@/components/admin/dialogs/create-edit-role-dialog";
import { RevokeRoleDialog } from "@/components/admin/dialogs/revoke-role-dialog";

function mapRole(role: ApiRecord): AdminRow {
  const powers = Array.isArray(role.powers) ? role.powers.length : 0;
  return {
    Role: field(role, ["role_name", "role_id"]),
    Description: field(role, ["description"]),
    Powers: formatNumber(powers),
    Type: role.is_system_role ? "System" : "Custom",
    State: "Active",
  };
}

function RoleRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const roleId = field(item, ["role_id", "_id"]);
  const isSystem = Boolean(item.is_system_role);
  const powerIds = Array.isArray(item.powers)
    ? (item.powers as Array<{ power_id?: string } | string>).map((p) =>
        typeof p === "string" ? p : (p.power_id ?? "")
      )
    : [];

  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_ADMIN_ROLE_MANAGE">
        <CreateEditRoleDialog
          mode="edit"
          roleId={roleId}
          currentName={field(item, ["role_name"])}
          currentDescription={field(item, ["description"])}
          currentPowerIds={powerIds}
          isSystemRole={isSystem}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Edit role">
              <PencilIcon />
            </Button>
          }
        />
      </Gated>
      <Gated allOf={["PWR_ADMIN_ROLE_MANAGE", "PWR_ADMIN_USER_ROLE_ASSIGN"]}>
        <RevokeRoleDialog
          roleId={roleId}
          roleName={field(item, ["role_name"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Revoke assignment">
              <UserMinusIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function RolesPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["roles"]}
      columns={["Role", "Description", "Powers", "Type", "State"]}
      description="Create roles, attach powers, and manage descriptions from rbac-service."
      emptyMessage="No roles returned by the backend."
      endpoint="/api/admin/rbac/roles"
      eyebrow="RBAC"
      mapRow={mapRole}
      metrics={(data, rows) => [
        {
          label: "Roles",
          value: formatNumber(data.total ?? rows.length),
          detail: "Backend reported total",
        },
        {
          label: "System",
          value: formatNumber(countRows(rows, "Type", /System/i)),
          detail: "Loaded system roles",
        },
        {
          label: "Custom",
          value: formatNumber(countRows(rows, "Type", /Custom/i)),
          detail: "Loaded custom roles",
        },
        {
          label: "Active",
          value: formatNumber(countRows(rows, "State", /Active/i)),
          detail: "Loaded active roles",
        },
      ]}
      primaryAction={(refresh) => (
        <Gated power="PWR_ADMIN_ROLE_MANAGE">
          <CreateEditRoleDialog
            mode="create"
            refresh={refresh}
            trigger={
              <Button>
                <PlusIcon />
                New role
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <RoleRowActions item={item} refresh={refresh} />}
      title="Roles"
      variant="access"
    />
  );
}
