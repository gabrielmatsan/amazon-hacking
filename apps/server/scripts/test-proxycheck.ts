import { proxyApiClient } from "../src/shared/infra/proxy-api/proxy-api-client";

const TEST_IPS = [
  { ip: "8.8.8.8", label: "Google DNS (datacenter)" },
  { ip: "1.1.1.1", label: "Cloudflare DNS (datacenter)" },
  { ip: "185.220.101.1", label: "Tor exit node" },
  { ip: "104.238.170.1", label: "VPN provider range" },
  { ip: "104.28.166.17", label: "Cloudflare Warp" },
  { ip:"177.134.161.4", label: "ip minha casa"}
];

async function main() {
  console.log("=== ProxyCheck.io - Teste de integração ===\n");

  // 1. Teste individual com checkIp
  console.log("--- checkIp (raw) ---");
  const raw = await proxyApiClient.checkIp(TEST_IPS[0].ip);
  console.log(`IP: ${TEST_IPS[0].ip} (${TEST_IPS[0].label})`);
  console.log(JSON.stringify(raw, null, 2));
  console.log();

  // 2. Teste individual com assessRisk
  console.log("--- assessRisk ---");
  for (const { ip, label } of TEST_IPS) {
    const result = await proxyApiClient.assessRisk(ip);
    if (!result) {
      console.log(`${ip} (${label}): lookup falhou`);
      continue;
    }
    console.log(`${ip} (${label}):`);
    console.log(`  Risk Score: ${result.riskScore}/100`);
    console.log(`  Network:    ${result.networkType} — ${result.provider}`);
    console.log(`  VPN: ${result.isVpn} | Proxy: ${result.isProxy} | Tor: ${result.isTor} | Hosting: ${result.isHosting}`);
    console.log(`  Confidence: ${result.confidence}% | Suspicious: ${result.isSuspicious}`);
    if (result.operatorName) console.log(`  Operator:   ${result.operatorName}`);
    console.log();
  }

  // 3. Teste batch
  console.log("--- checkBatch ---");
  const batchIps = TEST_IPS.map((t) => t.ip);
  const batchResults = await proxyApiClient.checkBatch(batchIps);
  console.log(`Batch: ${batchResults.size}/${batchIps.length} resultados`);
  for (const [ip, result] of batchResults) {
    const label = TEST_IPS.find((t) => t.ip === ip)?.label;
    console.log(`  ${ip} (${label}): risk=${result.detections.risk} vpn=${result.detections.vpn} proxy=${result.detections.proxy} tor=${result.detections.tor} hosting=${result.detections.hosting}`);
  }
}

main().catch(console.error);
