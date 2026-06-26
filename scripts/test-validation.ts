import { signedBackendFetch, backendUrls } from "../lib/backend";

async function main() {
  const body = {
    name: "gd",
    email: "dsfsdf@sfdf.com",
    phone: "+917856734523",
    sebi_license_number: "INH82193",
    sebi_license_doc_url: "https://stoxify.in/placeholder-doc.pdf",
    company_name: "gd",
    company_location: "vsdfv",
    business_type: "Partnership Firm",
    website: "",
    registration_type: "research_analyst",
    asset_under_research_cr: 2,
    number_of_clients: 2,
    registration_token: "REG_R_u8KFKrzMi_0_kM",
  };

  const res = await signedBackendFetch({
    baseUrl: backendUrls.user,
    path: "/users/analysts/onboard",
    method: "POST",
    body,
    deviceId: "test-device",
  });

  const data = await res.json();
  console.dir(data, { depth: null });
}

main().catch(console.error);
