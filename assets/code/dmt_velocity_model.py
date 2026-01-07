import math

# Given values
mc = 0.5     # Mass of car in kg
mw = 2.5   # Mass of weight in kg
rf = 0.013 # Effective bearing radius for front axle in meters
rR = 0.018 # Effective bearing radius for rear axle in meters
rp = 0.013 # Effective bearing radius for pulley shaft in meters
np = 14 # Revolutions of pulley shaft
mu = 0.1   # Coefficient of rolling friction
g = 9.81   # Gravitational acceleration in m/s^2
x = 1      # Initial height of car at the start of the ramp in meters
y = 0.5    # Change in height of the car at the end of the ramp in meters
If = 0.20     # Wheel-base in meters (distance between front and rear wheels)
Iw = 0.055     # Distance between rear wheel and mass attached in meters


total_distance = 5

#Calculate weights Pc and Pw
Pc = mc * g  # Weight of the car in Newtons
Pw = mw * g  # Weight of the mass in Newtons
total_weight = Pc + Pw

# Calculate distance from center of gravity to front axle (Ic)
Ic = If / 2  # Distance from center of gravity to front axle

#Calculate PR and PF using provided formulas
PR = -(((Pc * Ic) + (Pw * Iw)) / If) + Pc + Pw
PF = -PR + Pc + Pw
print(f"PR is {PR}")
print(f"PF is {PF}")

# Calculate revolutions
if total_weight != 0:  # Avoid division by zero
    Weight_front = PF / total_weight
    #print("the weightdistribution front"+ Weight_front)
    Weight_rear = PR / total_weight
    #print("the weightdistribution rear"+ Weight_rear)
    nF = total_distance / (2 * math.pi * rf)
    #print("the rev front is"+ nF)
    nR = total_distance / (2 * math.pi * rR)
    #print("the rev rear is"+ nR)
else:
    print("Error: Total weight is zero, cannot calculate nF and nR.")
    nF = nR = 0  # Safe defaults to prevent further errors

#Calculates friction term for the final velocity formula
friction_term = (2 * math.pi * mu) * (((mc + mw) * Weight_front * rf * nF) + ((mc + mw) * Weight_rear * rR * nR) + (mw * rp * np))
# calculate this friction term and see if it is equals to 1.711 .



print(f"Calculated friction term: {friction_term:.7f}")

#Calculates the numerator and denominator for V2
numerator_secondpart = (mw * x) - (mc * y)
numerator = (2 * g * numerator_secondpart) - friction_term
denominator = mc + mw


print(f"Numerator after subtracting friction: {numerator:.7f}")

# Check if denominator or numerator cause invalid operations
if denominator <= 0:
    print("Error: Denominator is zero or negative, cannot proceed with division.")
    V2 = None
elif numerator < 0:
    print("Error: Numerator is negative, cannot take square root of negative number.")
    V2 = None
else:
    # Step 8: Calculate final velocity V2
    V2 = math.sqrt(numerator / denominator)

# Output results
if V2 is not None:
    print(f"The final velocity V2 of the car is: {V2:.7f} m/s")
else:
    print("Calculation of V2 failed due to invalid inputs.")


print(f"The load on the rear axle PR is: {PR:.7f} N")
print(f"The load on the front axle PF is: {PF:.7f} N")
print(f"The weight distribution for the front axle is(%f): {Weight_front:.7f}")
print(f"The weight distribution for the rear axle is(%r): {Weight_rear:.7f}")
print(f"The revolutions for the front axle are(nf): {nF:.7f}")
print(f"The revolutions for the rear axle are(nR): {nR:.7f}")
print(f"Total distance of the ramp: {total_distance} meters")

### Results:
#PR is 20.233125000000005
#PF is 9.196874999999999
#Calculated friction term: 1.7858849
#Numerator after subtracting friction: 42.3591151
#The final velocity V2 of the car is: 3.7576196 m/s
#The load on the rear axle PR is: 20.2331250 N
#The load on the front axle PF is: 9.1968750 N
#The weight distribution for the front axle is(%f): 0.3125000
#The weight distribution for the rear axle is(%r): 0.6875000
#The revolutions for the front axle are(nf): 61.2134397
#The revolutions for the rear axle are(nR): 44.2097064
#Total distance of the ramp: 5 meters
