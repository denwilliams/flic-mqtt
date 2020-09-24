import * as mqtt from "mqtt";
import { FlicButton } from "./button";
import { FlicClient } from "./client";
import { join } from "path";

const logger = console;

const config = require("loke-config").create("flicmqtt", {
  appPath: join(__dirname, "/../"),
});

const mqttUri = "mqtt://" + config.get("mqtt.host");
logger.info("Connecting to broker " + mqttUri);

let options = {};
if (
  config.get("mqtt.username") != null &&
  config.get("mqtt.password") != null
) {
  logger.info("Using authentication for broker connection");
  options = {
    username: config.get("mqtt.username"),
    password: config.get("mqtt.password"),
  };
}

const mqttClient = mqtt.connect(mqttUri, options);
let mqttConnected = false;

const client = new FlicClient();
client.on("error", (err) => {
  logger.warn(`Unable to connect to Flic daemon: ${err.message}`);
});

const buttons = config.get("buttons");

const buttonConnections: Array<FlicButton> = buttons.map((b) => {
  logger.info("Connecting to " + b.address);
  const connection = client.getButton(b.id, b.address);
  connection.onClick(callback(b, "/click"));
  connection.onDoubleClick(callback(b, "/dblclick"));
  connection.onHold(callback(b, "/hold"));
  return connection;
});

function callback(buttonConfig: { id: string; topic: string }, suffix: string) {
  return () => {
    emit(buttonConfig.topic + suffix, buttonConfig.id);
  };
}

function emit(topic: string, id: string) {
  if (!mqttConnected) return;
  mqttClient.publish(topic, JSON.stringify({ id, timestamp: new Date() }));
  logger.info("Publish: " + topic);
}

mqttClient.on("connect", function () {
  logger.info("MQTT connected");
  mqttConnected = true;
  // client.subscribe('presence')
  // client.publish('presence', 'Hello mqtt')
});

mqttClient.on("close", console.log);
mqttClient.on("offline", console.log);
// mqttClient.on('error', console.error);
// mqttClient.on('message', console.log);

// mqttClient.on('message', function (topic, message) {
//   // message is Buffer
//   console.log(message.toString())
//   client.end()
// })
