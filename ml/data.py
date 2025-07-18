import random
import pandas as pd

categories = {
    "Travel": [
        "Uber ride", "Flight to Mumbai", "Train ticket", "Petrol refill", "Toll gate", "Airport cab",
        "Travel expense", "Flight cancellation fee", "Trip to Goa", "Bus pass"
    ],
    "Food": [
        "Dinner at McDonald's", "Lunch from Zomato", "Snacks from store", "Swiggy delivery", "Restaurant bill",
        "Ordered biryani", "Coffee shop", "Breakfast sandwich", "Juice bar", "Fast food outlet"
    ],
    "Groceries": [
        "Bought milk", "Grocery shopping", "Vegetables from market", "Monthly ration", "Supermarket bill",
        "Bread and eggs", "Walmart purchase", "Grocery essentials", "Weekly grocery run", "Local grocery shop"
    ],
    "Entertainment": [
        "Netflix subscription", "Movie night", "Concert tickets", "Theme park", "Spotify Premium",
        "Live show", "Video game purchase", "Online movie rental", "Karaoke night", "Amusement park"
    ],
    "Utilities": [
        "Electricity bill", "Internet recharge", "Mobile bill", "Gas connection", "Water bill",
        "Utility charges", "DTH recharge", "Power backup fees", "Municipal tax", "Postpaid payment"
    ],
    "Shopping": [
        "Online shopping", "Bought jeans", "T-shirt from H&M", "Shoes from Nike", "Amazon order",
        "Fashion sale", "New handbag", "Gift wrap service", "Discounted deal", "Clothes from Myntra"
    ],
    "Electronics": [
        "Phone charger", "Bluetooth headset", "Smartwatch", "USB drive", "Laptop payment",
        "Keyboard", "Monitor", "Router", "Power bank", "Tablet purchase"
    ],
    "Beauty Products": [
        "Shampoo and conditioner", "Salon visit", "Makeup kit", "Facewash", "Lipstick",
        "Nykaa order", "Hair spa", "Moisturizer", "Sunscreen", "Nail polish"
    ],
    "Health": [
        "Doctor consultation", "Apollo Pharmacy", "Health check-up", "Medicines", "Clinic fees",
        "COVID test", "Vaccination bill", "First aid kit", "Blood pressure monitor", "Dietitian visit"
    ],
    "Fitness": [
        "Gym membership", "Yoga class", "Treadmill EMI", "Protein shake", "Running shoes",
        "Personal trainer", "Fitness tracker", "Zumba session", "Dumbbells", "CrossFit fees"
    ],
    "Gifts": [
        "Birthday gift", "Wedding present", "Anniversary card", "Gift for dad", "Return gift",
        "Valentine gift", "Festival box", "Gift voucher", "Greeting card", "New year gift"
    ],
    "Education": [
        "Tuition fees", "Course enrollment", "Exam fee", "Online course", "Reference book",
        "Stationery", "School uniform", "College ID renewal", "Textbooks", "Learning app subscription"
    ],
    "Miscellaneous": [
        "Unplanned expense", "Fine payment", "Lost wallet", "ATM fee", "Random charge",
        "Charity donation", "Penalty", "Cash withdrawal fee", "Tips", "Unexpected purchase"
    ]
}

data = []
for category, descriptions in categories.items():
    for _ in range(30):
        desc = random.choice(descriptions)
        if random.random() > 0.5:
            desc += f" #{random.randint(1, 100)}"
        data.append((desc, category))

df = pd.DataFrame(data, columns=["description", "category"])
df.to_csv("dataset.csv", index=False)

print("dataset saved as 'dataset.csv'")
