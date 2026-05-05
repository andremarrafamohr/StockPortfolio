const Account = require("../models/Account");
const TradeJournal = require("../models/TradeJournal");

async function ensureDefaultAccount(userId) {
  let account = await Account.findOne({ user: userId, name: "Main" });
  if (!account) {
    account = await Account.create({ user: userId, name: "Main", startingBalance: 0 });
  }

  await TradeJournal.updateMany(
    { user: userId, account: { $exists: false } },
    { $set: { account: account._id } }
  );

  return account;
}

exports.getAccounts = async (req, res) => {
  try {
    const mainAccount = await ensureDefaultAccount(req.user._id);
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });

    res.json({
      accounts,
      defaultAccountId: mainAccount._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { name, startingBalance, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Account name is required" });
    }

    const account = await Account.create({
      user: req.user._id,
      name: name.trim(),
      startingBalance: startingBalance !== undefined && startingBalance !== "" ? Number(startingBalance) : 0,
      notes: notes || "",
    });

    res.status(201).json(account);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "An account with that name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.ensureDefaultAccount = ensureDefaultAccount;
