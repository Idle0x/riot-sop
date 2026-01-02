// 1. Add this to the Interface at the top
interface FinancialContextType {
  // ... existing types ...
  updateGoalAmount: (id: string, amountToAdd: number) => void; // <--- NEW
}

// ... inside the Provider component ...

  // 2. Add this function
  const updateGoalAmount = (id: string, amountToAdd: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newAmount = goal.currentAmount + amountToAdd;
        // Don't go over target
        return { 
          ...goal, 
          currentAmount: Math.min(newAmount, goal.targetAmount),
          isCompleted: newAmount >= goal.targetAmount
        };
      }
      return goal;
    }));
  };

  // 3. Add to the value object
  return (
    <FinancialContext.Provider value={{ 
      accounts, 
      goals, 
      transactions,
      updateAccountBalance,
      addTransaction,
      updateGoalAmount // <--- NEW
    }}>
      {children}
    </FinancialContext.Provider>
  );
