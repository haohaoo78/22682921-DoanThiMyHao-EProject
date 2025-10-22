const chai = require("chai");
const chaiHttp = require("chai-http");
require("dotenv").config();
const { expect } = chai;

chai.use(chaiHttp);

describe("Products API", function () {
  this.timeout(60000);

  const PRODUCT_URL = "http://product:3001"; // container Product chạy trên Docker
  const AUTH_URL = "http://auth:3000";      // container Auth chạy trên Docker

  let authToken;
  let productId;

  // dùng trực tiếp requester tới container Product và Auth
  const productRequester = chai.request(PRODUCT_URL).keepOpen();
  const authRequester = chai.request(AUTH_URL);

  before(async function () {
    // Lấy token từ Auth container
    const res = await authRequester
      .post("/login")
      .send({
        username: process.env.TEST_USER,
        password: process.env.TEST_PASS,
      });
    authToken = res.body.token;
  });

  after(() => {
    productRequester.close();
  });

  describe("POST /api/products", () => {
    it("should create a new product", async () => {
      const product = { name: "Product Test", description: "Description Test", price: 15 };
      const res = await productRequester
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      productId = res.body._id;
    });
  });

  describe("GET /api/products", () => {
    it("should get all products", async () => {
      const res = await productRequester
        .get("/api/products")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an("array");
    });

    it("should get product by ID", async () => {
      const res = await productRequester
        .get(`/api/products/id/${productId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("_id", productId);
    });
  });
});
