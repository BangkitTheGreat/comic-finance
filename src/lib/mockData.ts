export const userProfile = {
  name: "Penny User",
  email: "penny@example.com",
  avatar: "https://ui-avatars.com/api/?name=Penny+User&background=BB6BD9&color=fff",
};

export const dashboardOverview = {
  totalBalance: 24592.80,
  monthlyIncome: 5240.00,
  monthlyExpenses: 3180.00,
  accounts: [
    { name: "Checking", balance: 12000, color: "bg-secondary" },
    { name: "Savings", balance: 10000, color: "bg-pop-purple" },
    { name: "Investment", balance: 2592.80, color: "bg-warning" }
  ]
};

export const recentTransactions = [
  {
    id: "t1",
    merchant: "Joe's Diner",
    category: "Food & Dining",
    date: "Today",
    account: "Credit Card",
    amount: -32.50,
    icon: "restaurant",
    color: "bg-pop-pink"
  },
  {
    id: "t2",
    merchant: "Tech Corp Inc.",
    category: "Salary",
    date: "Yesterday",
    account: "Checking",
    amount: 4250.00,
    icon: "payments",
    color: "bg-secondary-container"
  },
  {
    id: "t3",
    merchant: "City Transit",
    category: "Transport",
    date: "Oct 24",
    account: "Debit Card",
    amount: -2.75,
    icon: "directions_car",
    color: "bg-pop-blue"
  },
  {
    id: "t4",
    merchant: "MegaMart",
    category: "Groceries",
    date: "Oct 23",
    account: "Credit Card",
    amount: -145.20,
    icon: "shopping_bag",
    color: "bg-pop-purple"
  }
];

export const savingsGoals = [
  {
    id: "g1",
    name: "Japan Trip",
    current: 3000,
    target: 5000,
    icon: "flight_takeoff",
    color: "text-primary",
    bgColor: "bg-primary"
  },
  {
    id: "g2",
    name: "New Car Downpayment",
    current: 8000,
    target: 10000,
    icon: "directions_car",
    color: "text-pop-purple",
    bgColor: "bg-pop-purple"
  }
];

export const upcomingBills = [
  {
    id: "b1",
    name: "Internet",
    dueIn: "2 days",
    amount: 79.99,
    icon: "wifi",
    status: "upcoming"
  },
  {
    id: "b2",
    name: "Electricity",
    dueIn: "5 days",
    amount: 124.50,
    icon: "bolt",
    status: "upcoming"
  },
  {
    id: "b3",
    name: "Water",
    dueIn: "Yesterday",
    amount: 45.00,
    icon: "water_drop",
    status: "overdue"
  }
];

export const budgetCategories = [
  {
    id: "bc1",
    name: "Food & Dining",
    spent: 580,
    budget: 600,
    icon: "restaurant",
    color: "bg-tertiary-fixed",
    progressColor: "bg-warning"
  },
  {
    id: "bc2",
    name: "Bills",
    spent: 450,
    budget: 500,
    icon: "bolt",
    color: "bg-secondary-container",
    progressColor: "bg-primary"
  },
  {
    id: "bc3",
    name: "Entertainment",
    spent: 120,
    budget: 300,
    icon: "movie",
    color: "bg-pop-purple",
    progressColor: "bg-secondary"
  }
];
