"use client";

import { PencilIcon, RefreshCwIcon, ShieldOffIcon, SlidersHorizontalIcon } from "lucide-react";

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
import { BlockUserDialog } from "@/components/admin/dialogs/block-user-dialog";
import { ChangeUserStateDialog } from "@/components/admin/dialogs/change-user-state-dialog";
import { EditUserProfileDialog } from "@/components/admin/dialogs/edit-user-profile-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "user_type",
    label: "User type",
    options: [
      { label: "End user", value: "END_USER" },
      { label: "Analyst", value: "ANALYST" },
      { label: "Internal team", value: "INTERNAL_TEAM" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      { label: "Unverified", value: "UNVERIFIED" },
      { label: "KYC pending", value: "KYC_PENDING" },
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Blocked", value: "BLOCKED" },
    ],
  },
];

function mapUser(user: ApiRecord): AdminRow {
  const kyc = user.kyc as ApiRecord | undefined;
  return {
    User: field(user, ["name", "email", "user_id"]),
    Type: field(user, ["user_type"]),
    State: stateLabel(user.state),
    KYC: kyc?.aadhaar_verified ? "Verified" : stateLabel(user.state) === "KYC PENDING" ? "Pending" : "-",
    Created: formatDate(user.created_at),
  };
}

function UserRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const userId = field(item, ["user_id", "_id"]);
  const state = String(item.state ?? "");

  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_USER_BLOCK">
        <BlockUserDialog userId={userId} currentState={state} refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label={/BLOCKED/i.test(state) ? "Unblock" : "Block"}>
              <ShieldOffIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_USER_STATE_CHANGE">
        <ChangeUserStateDialog userId={userId} currentState={state} refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Change state">
              <SlidersHorizontalIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_USER_PROFILE_EDIT_ALL">
        <EditUserProfileDialog
          userId={userId}
          currentName={field(item, ["name"])}
          currentPhone={field(item, ["phone"])}
          currentProfilePicUrl={field(item, ["profile_pic_url"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Edit profile">
              <PencilIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function UsersPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["users"]}
      columns={["User", "Type", "State", "KYC", "Created"]}
      description="Read users, update state, block/unblock, and review profile details from user-service."
      emptyMessage="No users returned by the backend."
      endpoint="/api/admin/users"
      eyebrow="User management"
      filters={FILTERS}
      mapRow={mapUser}
      metrics={(data, rows) => [
        { label: "Total users", value: formatNumber(totalFrom(data, rows.length)), detail: "Backend reported total" },
        { label: "Active", value: formatNumber(countRows(rows, "State", /ACTIVE/i)), detail: "Loaded active rows" },
        { label: "Blocked", value: formatNumber(countRows(rows, "State", /BLOCKED/i)), detail: "Loaded blocked rows" },
        { label: "KYC pending", value: formatNumber(countRows(rows, "KYC", /Pending/i)), detail: "Loaded pending rows" },
      ]}
      paginated
      rowActions={(item, refresh) => <UserRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search by name, email, ID, phone"
      title="Users"
      variant="people"
    />
  );
}
