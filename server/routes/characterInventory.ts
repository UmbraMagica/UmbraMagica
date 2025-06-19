import express from "express";
import { supabase } from "../supabaseClient";

const router = express.Router();

router.get("/:characterId/inventory", async (req, res) => {
  const { characterId } = req.params;

  const { data, error } = await supabase
    .from("character_inventory")
    .select("*")
    .eq("character_id", characterId)
    .order("acquired_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: "DB error", error: error.message });
  }

  res.json(data);
});

router.post("/:characterId/inventory", async (req, res) => {
  const { characterId } = req.params;
  const body = req.body;

  const { error } = await supabase.from("character_inventory").insert({
    character_id: Number(characterId),
    item_type: body.item_type,
    item_id: body.item_id,
    price: body.price,
    item_name: body.item_name || null,
    description: body.description || null,
    rarity: body.rarity || null,
    quantity: body.quantity || 1,
    notes: body.notes || null,
    category: body.category || null,
    is_equipped: false, // nebo jakýkoli default
    acquired_at: new Date().toISOString(),
  });

  if (error) {
    return res.status(500).json({ message: "DB insert error", error: error.message });
  }

  res.status(201).json({ message: "Item added" });
});

export default router;
