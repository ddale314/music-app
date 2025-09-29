export class Complex {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    add(other) {
        let result = new Complex(this.real + other.real, this.imaginary + other.imaginary);
        return result;
    }

    subtract(other) {
        let result = new Complex(this.real - other.real, this.imaginary - other.imaginary);
        return result;
    }

    magnitude() {
        return Math.sqrt(this.real*this.real+this.imaginary*this.imaginary);
    }

    multiply(other) {
        let r = this.real*other.real - this.imaginary*other.imaginary;
        let i = this.imaginary*other.real + this.real*other.imaginary;
        let result = new Complex(r, i);
        return result;
    }

    complexDivide(other) {
        let denominator = other.real*other.real-other.imaginary*other.imaginary;
        let conjugate = new Complex(other.real, -other.imaginary);
        let numerator = this.multiply(conjugate);
        return numerator.realDivide(denominator);
    }

    realDivide(real) {
        return new Complex(this.real/real, this.imaginary/real);
    }

    toString() {
        return this.real + ' + ' + this.imaginary + 'i';
    }
}