import { LitElement } from "lit-element";
import inner from "./inner.cjs";

export default class Outer extends LitElement {
	render() {
		return inner;
	}
}
