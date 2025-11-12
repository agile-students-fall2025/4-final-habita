// back-end/data/mockData.js
export const bills = [
  { id: "b1", title: "Electric Bill", amount: 120, splitBetween: ["Alex", "Sam"] },
  { id: "b2", title: "Internet", amount: 80, splitBetween: ["Jordan"] },
];

export const tasks = [
  { id: "t1", title: "Take out trash", completed: false },
  { id: "t2", title: "Clean kitchen", completed: true },
];

export const chats = [
  { id: "c1", contextType: "house", sender: "Alex", text: "Welcome!", timestamp: "09:00" },
  { id: "c2", contextType: "bill", contextId: "b1", sender: "Sam", text: "Paid!", timestamp: "09:10" },
];
