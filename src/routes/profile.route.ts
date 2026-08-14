import { Hono } from "hono";
import {
  getProfileHandler,
  getRepositoriesHandler,
  getLanguagesHandler,
} from "@/controllers/profile.controller";

export const profileRoute = new Hono();

profileRoute.get("/profile/:username", getProfileHandler);
profileRoute.get("/repositories/:username", getRepositoriesHandler);
profileRoute.get("/languages/:username", getLanguagesHandler);
