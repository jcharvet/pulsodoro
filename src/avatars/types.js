import { renderTabby, renderBengal } from "./cat.js";
import { renderDog } from "./dog.js";
import { renderTurtle } from "./turtle.js";
import { renderPanda } from "./panda.js";

export const AVATAR_TYPES = {
  tabby: { name: "Orange Tabby", render: renderTabby },
  bengal: { name: "Brown Tabby", render: renderBengal },
  dog: { name: "Dog", render: renderDog },
  turtle: { name: "Turtle", render: renderTurtle },
  panda: { name: "Panda", render: renderPanda },
};
