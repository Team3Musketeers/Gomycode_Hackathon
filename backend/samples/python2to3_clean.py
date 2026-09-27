import math


def celsius_to_fahrenheit(celsius):
    return celsius * 9.0 / 5.0 + 32


def area_of_circle(radius):
    return math.pi * radius ** 2


def main():
    print "Enter a temperature in Celsius:"
    value = raw_input()
    celsius = float(value)
    print "That's", celsius_to_fahrenheit(celsius), "Fahrenheit"

    print "Enter a radius:"
    r = raw_input()
    radius = float(r)
    print "Circle area is", area_of_circle(radius)


if __name__ == '__main__':
    main()