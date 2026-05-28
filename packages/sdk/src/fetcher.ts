import { createFetcherAgent, type FetcherConfig, type FetcherStorage } from "@fetcher-fil/core";

export class Fetcher {
  private storage: FetcherStorage;

  constructor(config: FetcherConfig) {
    this.storage = createFetcherAgent(config);
  }

  store = (input: Parameters<FetcherStorage["storeFile"]>[0]) => this.storage.storeFile(input);
  retrieve = (input: Parameters<FetcherStorage["retrieve"]>[0]) => this.storage.retrieve(input);
  verify = (input: Parameters<FetcherStorage["verify"]>[0]) => this.storage.verify(input);
  checkDeal = (input: Parameters<FetcherStorage["verify"]>[0]) => this.storage.checkDeal(input);
  list = (input?: Parameters<FetcherStorage["listFiles"]>[0]) => this.storage.listFiles(input ?? {});
  delete = (input: Parameters<FetcherStorage["deleteFile"]>[0]) => this.storage.deleteFile(input);
  balance = () => this.storage.getBalance();
  prepare = (input: Parameters<FetcherStorage["prepareStorage"]>[0]) => this.storage.prepareStorage(input);
  estimateCost = (input: Parameters<FetcherStorage["estimateCost"]>[0]) => this.storage.estimateCost(input);
  stats = (input?: Parameters<FetcherStorage["getStorageStats"]>[0]) => this.storage.getStorageStats(input);
  deals = (input?: Parameters<FetcherStorage["listDeals"]>[0]) => this.storage.listDeals(input);
  proof = (input: Parameters<FetcherStorage["getProof"]>[0]) => this.storage.getProof(input);

  memory = {
    store: (input: Parameters<FetcherStorage["storeMemory"]>[0]) => this.storage.storeMemory(input),
    retrieve: (input: Parameters<FetcherStorage["retrieveMemory"]>[0]) => this.storage.retrieveMemory(input),
    update: (input: Parameters<FetcherStorage["updateMemory"]>[0]) => this.storage.updateMemory(input),
    list: (input: Parameters<FetcherStorage["listMemories"]>[0]) => this.storage.listMemories(input),
    delete: (input: Parameters<FetcherStorage["deleteMemory"]>[0]) => this.storage.deleteMemory(input)
  };

  getStorage() {
    return this.storage;
  }
}
