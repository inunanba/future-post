# 瀬名へ — Diana実機の最初のバトン

request_id: R-20261125-grokbot-work-qorechain-build-01
Workは秘密を取得せず、署名も送信もしない。この手順も既存の実行直前ゲートを省略する許可ではない。テストネット・faucet残高だけ。実行結果不明なら再送しない。

## 1. まず既存アカウントと接続を確認

登録済みの `qor1rgsq0sgpww6yevnmedlqe797tc4v57u4as0w52` と `0x1a2007c10173b44cb27bcb7e0cf8be5e2aca7b95` は依頼上coin-118。EVMで署名するcoin-60とは別物。別アドレスのwindowを流用しない。新しいウォレットは作らず、許可された既存QoreX内のcoin-60準備は瀬名が担当。パスワード・鍵・復元語を表示、コピー、ログ、コミットしない。Workへ送らない。

QoreX内でTESTNET/Dianaを確認。`wallet-check.html` は公開アカウント接続のみで、署名・送信はしない。既存の許可済みローカル検証環境で開く。接続のために公開ホスティングやアカウント作成を新設しない。ブラウザのDOMプレビューを実ウォレット接続と呼ばない。

公式SDKはNative `enable(chainId: string)` / `getKey(chainId)`。現行QoreX EVMは接続と照会のみで `eth_sendTransaction` は未対応。実EVM signerがない場合、秘密の書出しで迂回せず「coin-60公開アドレス・署名可能経路の有無・不足機能」を返信する。Dashboardの既存署名/デプロイUIを使うなら、同じアカウントかを先に確認。Dashboardの別テスト財布で通った取引をQoreX本人取引と混同しない。

## 2. ローカル再現（ウォレット不要）

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check
```

Ganacheはインメモリのみ、RPCサーバを開かない。NodeのµWS native moduleがない場合はJS実装へfallbackする。Diana接続の代用品ではない。

## 3. 取引準備（まだ送らない）

`npm run compile` は `artifacts/FuturePostRelease.json` にABI/bytecodeを出す。Solidity0.8.30、Shanghai、optimizer200。これは旧checkpointの非最適化bytecodeとは長さが異なる。

`scripts/prepare-diana.mjs` は入力JSONから未署名txだけを出す:

```sh
node scripts/prepare-diana.mjs reviewed-public-input.json > unsigned-reviewed.json
```

入力例（fromは**確認済みcoin-60公開アドレスに置換**。以下は例示であり送信不可）:

```json
{"operation":"deploy","chainId":9800,"rpc":"https://evm-testnet.qore.host","from":"0x1111111111111111111111111111111111111111"}
```

registerにはcontract、letterId(bytes32)、recipientBinding(bytes32)、ciphertextHash(bytes32)、shareBCommitment(keccak256(B))、unlockAtとobservedBlockTime（Unix秒）が必要。releaseには同じcontract/id、32-byte shareB、commitment、unlockAt、直近チェーン時刻を渡す。Bは予定時刻まで端末内に置き、公開前のファイルはrepoへ入れない。plaintext、A、鍵やcredentialsは入力形式自体が受け付けない。

実行直前に瀬名がRPCのeth_chainId=0x2648、アカウント一致、最新nonce、シミュレーション、必要gasと残高、署名経路と既存承認を確認。許可済みcoin-60にだけ必要最小windowを開く。**0.09 QORは初回PQ鍵登録費で、window全体の定額費ではない。** 別途テストnet手数料。枠はgas上限×fee capも数えるので、実見積もりに合う最小の期間・回数・上限を選び、終わったら閉じる。mainnetや実費が要求されたら実行しない。

## 3A. 確認済みcoin-60と最小window手順（2026-11-25追記）

同じ既存QoreX内のcoin-60は Native `qor1r274urptm66u0kn6eujalcl0v7sz5tj0tus05t` / EVM `0x1abd5e0c2bdeb5c7da7acf25dfe3ef67a02a2e4f`。10 testQOR入金は tx `9089AF34B30B6D863148048F7036E329248216F5FA1D42C56D6EBBDE40C75A04`、height 10706200、code 0として瀬名が返却。これはNative hybrid送金の証拠であり、EVM deploy成功ではない。

1. 既存ブラウザで `eth_chainId=0x2648`、選択accountが上記coin-60 EVM、windowがclosedであることを読戻す。QoreX自身の `eth_sendTransaction` はUNKNOWNのまま。新しい拡張導入、秘密export、別財布で迂回しない。既存環境に署名可能なMetaMask経路がなければ `BLOCKED_CAPABILITY` を返して停止。
2. windowを開く前にdeployとregisterを各々 `eth_estimateGas` / read-only simulationする。Window Aは取引回数 **2**。期間はUIが許す最短で、deploy/registerとreceipt読戻しに足りる値だけ。使用上限は各 `estimateGas × maxFeePerGas` の合計に20%余裕を加え、UI精度へ切り上げる。valueは両方0。合計が **1 testQOR** を超える、またはestimate/simulationが不明なら開かず返信。
3. deployを1回だけ送り、`CONFIRMED_SUCCESS`、contractAddress、code一致を確認してからregisterへ進む。wallet prompt=`WALLET_SIGNATURE_REQUESTED`、hashだけ=`BROADCAST_UNKNOWN`、pending=`TX_PENDING`。これらを成功扱いしない。
4. `npm run export:bundle -- private-local-input.json > public-bundle.json` で2端末用公開bundleを作る。入力ファイルは瀬名の端末内だけで扱い、repoへ保存しない。出力にplaintext/shareA/shareB/contentKey/credentialが無いことを確認。次に、bundleとfrom/contract/observedBlockTimeだけを含むreviewed-public-registration.jsonから `npm run prepare:registration -- reviewed-public-registration.json` を実行。bundleDigestとunsigned planを保存。
5. register後はreceiptと `getLetter` の値がbundleのregistrationと一致することを読戻す。unlock前は送信せずsimulation拒否だけ。
6. release時はWindow Bを別に開く。取引回数 **1**、UI最短期間、使用上限はreleaseの `estimateGas × maxFeePerGas` に20%余裕、上限 **0.2 testQOR**。不明・超過なら停止。正しいBを1回だけ送信し、確定receipt/event/readback後に閉じる。

0.09 testQORの初回PQ鍵登録表示はwindow上限や通常gasと別項目として記録し、二重に「window定額」と数えない。Window A/Bの実設定値、見積り、実消費、開閉時刻を証拠へ残す。

## 4. 実証したい順番

1. QoreX接続の公開アドレス、Nativeのcapabilities、coin-60の署名経路を返す。
2. 許可済みの同一アカウントでcontract deploy。receipt成功、contractAddress、block、eth_getCodeとコンパイルruntimeの一致を保存。
3. 架空の2アカウント手紙を登録。register receiptとgetLetter照合。recipientの登録済みKEMキー/ML-DSA bindingは別証拠。
4. unlock前のreleaseはまずread-only simulationで拒否を確認。無駄な拒否取引を送らない。別送信者・違うBもsimulationで拒否。
5. chain時刻がunlockAt以上になったら正しいBを1回公開、receiptとevent/readbackを保存。相手側がA+Bで開け、outsiderは失敗することを確認。
6. Quantum Pass用のNative hybrid取引はQoreXの既存承認済み操作で行い、`code=0, height>0, shield=shielded, txHash` とチェーン上の確認を別に保存。EVM receiptやwindowの存在だけで「hybrid済み」としない。具体的なNative操作とpayloadは送信前に既存ゲートで照合。Workはこのcheckpointで自動送信機能を渡していない。

## 5. 返してほしいもの

`bus/evidence/R-20261125-grokbot-work-qorechain-build-01/` に公開アドレス、QoreXの公開capability、contractアドレス、取引hash、chain/height/status、readbackと画面、実行したsource commitを保存。テンプレは `evidence/live-template.json`。未実行はNOT_RUN、取得不完全はUNKNOWN。秘密や手紙本文は保存しない。今回の内部テストをDiana成功に書き換えない。

公式締切は12/3 08:59 JST、途中締切を新設しない。次はこの返信からWorkが実アカウントとreceiptの導線を仕上げる。公開repo・公式登録・提出・動画uploadはWorkが行わない。
