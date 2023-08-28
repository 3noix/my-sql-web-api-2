import {initTRPC} from "@trpc/server";
import {EventEmitter} from "events";

export const trpc = initTRPC.create();
export const ee = new EventEmitter();
