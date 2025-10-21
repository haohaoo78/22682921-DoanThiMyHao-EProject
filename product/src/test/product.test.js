const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const expect = chai.expect;
require("dotenv").config();
const config = require("../config");
const broker = require("../utils/messageBroker");

chai.use(chaiHttp);

// Hàm chờ auth service sẵn sàng
async function waitForAuth(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await chai
        .request(config.authServiceUrl || "http://auth:3000")
        .post("/login")
        .send({
          username: config.testUser.username,
          password: config.testUser.password,
        });
      return res.body.token;
    } catch (err) {
      console.log(`Auth not ready, retrying... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Auth service is not available after retries");
}

describe("Products API", function () {
  let app;
  let authToken;
  let productId;

  // Tăng timeout cho before hook
  this.timeout(60000);

before(async function () {
  app = new App();
  await Promise.all([app.connectDB(), app.setupMessageBroker()]);
  authToken = await waitForAuth();
  console.log("Auth token:", authToken);

  // Chờ RabbitMQ channel sẵn sàng trước khi chạy test buy
  await broker.waitForChannel();

  // Start server test trên port 4000
  app.start(4000);
});

  after(async function () {
    await app.disconnectDB();
    await app.stop();
  });

  describe("POST /api/products", () => {
    it("should create a new product", async () => {
      const product = {
        name: "Product Test",
        description: "Description Test",
        price: 15,
      };

      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      productId = res.body._id; // lưu để test sau
    });

    it("should return 400 if name is missing", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ description: "No name", price: 10 });

      expect(res).to.have.status(400);
    });
  });

  describe("GET /api/products", () => {
    it("should get all products", async () => {
      const res = await chai
        .request(app.app)
        .get("/api/products")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
    });

    it("should get product by ID", async () => {
      const res = await chai
        .request(app.app)
        .get(`/api/products/id/${productId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("_id", productId);
    });
  });

  describe("POST /api/products/buy", () => {
    it("should create an order for a product", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products/buy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ productId, quantity: 2 });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("productId", productId);
      expect(res.body).to.have.property("quantity", 2);
    });
  });
});
