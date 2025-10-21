const amqp = require("amqplib");

class MessageBroker {
  constructor() {
    this.channel = null;
  }

  async connect() {
    console.log("Connecting to RabbitMQ...");

    setTimeout(async () => {
      try {
        const user = process.env.RABBITMQ_USER;
        const pass = process.env.RABBITMQ_PASS;
        const host = "rabbitmq"; 
        const port = 5672;
        const connection = await amqp.connect(`amqp://${user}:${pass}@${host}:${port}`);
        this.channel = await connection.createChannel();
        await this.channel.assertQueue("products"); 
        console.log("RabbitMQ connected");
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
      }
    }, 20000); // delay 20 seconds to wait for RabbitMQ to start
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
