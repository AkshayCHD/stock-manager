import { Result } from "express-validator";

class ValidationError extends Error {
  public status = 402;
  public error = "";
  constructor(error: Result, statusCode = 402) {
    super("");
    Object.setPrototypeOf(this, ValidationError.prototype);
    const errors = error.array();
    const message = errors.reduce(
      (prevValue, currentValue) => prevValue + currentValue.msg + ", ",
      ""
    );
    this.message = message;
    this.name = "ValidationError";
    this.status = statusCode;
  }
}

export default ValidationError;
