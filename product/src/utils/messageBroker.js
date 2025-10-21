const amqp = require("amqplib");
const rabbitMQConfig = require("../config").rabbitMQ;

class MessageBroker {
  constructor() {
    this.channel = null;
  }

  // Kết nối RabbitMQ với delay 20s để chờ container khởi động
  async connect() {
    console.log("Connecting to RabbitMQ...");

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const { user, pass, host, port } = rabbitMQConfig;
          const connection = await amqp.connect(`amqp://${user}:${pass}@${host}:${port}`);
          this.channel = await connection.createChannel();
          await this.channel.assertQueue("products"); 
          console.log("RabbitMQ connected");
          resolve(); // channel sẵn sàng
        } catch (err) {
          console.error("Failed to connect to RabbitMQ:", err.message);
          reject(err);
        }
      }, 20000); // delay 20s
    });
  }

  // Chờ channel sẵn sàng (dùng trong test hoặc trước khi publish/consume)
  async waitForChannel(retries = 20, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      if (this.channel) return;
      console.log(`Waiting for RabbitMQ channel... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
    throw new Error("RabbitMQ channel not ready after retries");
  }

  async publishMessage(queue, message) { 
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return;
    }

    try {
      await this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message))
      );
    } catch (err) {
      console.log(err);
    }
  }

  async consumeMessage(queue, callback) { 
    if (!this.channel) {
      console.error("No RabbitMQ channel available."); 
      return;
    }

    try {
      await this.channel.consume(queue, (message) => { 
        const content = message.content.toString(); 
        const parsedContent = JSON.parse(content); 
        callback(parsedContent);
        this.channel.ack(message); 
      });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new MessageBroker();
