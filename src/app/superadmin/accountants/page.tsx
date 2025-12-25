"use client";

import React, { useState, useEffect } from "react";
import { useAlert } from "@/components/ui/AlertProvider";
import apiClient from "@/lib/api-client";
import { Users, Plus, Edit2, Trash2, RefreshCw, Search, X, Save, User, Key, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Accountant {
  id: string;
  name: string;
  login: string;
  telegramId: string | null;
  companyCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AccountantsPage() {
  const { showSuccess, showError } = useAlert();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    password: "",
    telegramId: "",
  });

  const fetchAccountants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/accountants");
      if (res.data.ok) {
        setAccountants(res.data.accountants);
      }
    } catch (error) {
      showError("Failed to fetch accountants");
      console.error("Error fetching accountants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountants();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await apiClient.post("/accountants", {
        name: formData.name,
        login: formData.login,
        password: formData.password,
        telegramId: formData.telegramId || undefined,
      });
      if (res.data.ok) {
        showSuccess("Accountant created successfully");
        setShowForm(false);
        setFormData({ name: "", login: "", password: "", telegramId: "" });
        fetchAccountants();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || "Failed to create accountant");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const updateData: any = {
        name: formData.name,
      };
      if (formData.login) updateData.login = formData.login;
      if (formData.password) updateData.password = formData.password;
      if (formData.telegramId !== undefined) updateData.telegramId = formData.telegramId || null;

      const res = await apiClient.put(`/accountants/${editingId}`, updateData);
      if (res.data.ok) {
        showSuccess("Accountant updated successfully");
        setEditingId(null);
        setFormData({ name: "", login: "", password: "", telegramId: "" });
        fetchAccountants();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || "Failed to update accountant");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accountant?")) return;
    try {
      const res = await apiClient.delete(`/accountants/${id}`);
      if (res.data.ok) {
        showSuccess("Accountant deleted successfully");
        fetchAccountants();
      }
    } catch (error: any) {
      showError(error.response?.data?.error || "Failed to delete accountant");
    }
  };

  const startEdit = (accountant: Accountant) => {
    setEditingId(accountant.id);
    setFormData({
      name: accountant.name,
      login: accountant.login,
      password: "", // Don't show password
      telegramId: accountant.telegramId || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", login: "", password: "", telegramId: "" });
  };

  const filteredAccountants = accountants.filter((acc) => {
    const search = searchTerm.toLowerCase();
    return (
      acc.name.toLowerCase().includes(search) ||
      acc.login.toLowerCase().includes(search) ||
      acc.telegramId?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Accountants
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage accountants and their access to companies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccountants}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-all ${
              loading ? "animate-spin" : ""
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-bold text-sm">Refresh</span>
          </button>
          {!showForm && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: "", login: "", password: "", telegramId: "" });
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Accountant
            </Button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit Accountant" : "Create New Accountant"}
            </h2>
            <button
              onClick={cancelForm}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Accountant full name"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Login"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              placeholder="Unique login"
              leftIcon={<User className="w-4 h-4" />}
              required
              disabled={!!editingId}
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingId ? "Leave empty to keep current" : "Password"}
              leftIcon={<Key className="w-4 h-4" />}
              required={!editingId}
            />
            <Input
              label="Telegram ID (Optional)"
              value={formData.telegramId}
              onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
              placeholder="Telegram user ID"
              leftIcon={<MessageCircle className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={editingId ? handleUpdate : handleCreate}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, login, or Telegram ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
        />
      </div>

      {/* Accountants List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : filteredAccountants.length === 0 ? (
        <div className="bg-white dark:bg-[#111322] rounded-xl p-12 border border-slate-200 dark:border-white/5 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {searchTerm ? "No accountants found matching your search" : "No accountants created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAccountants.map((accountant) => (
            <div
              key={accountant.id}
              className="bg-white dark:bg-[#111322] rounded-xl p-6 border border-slate-200 dark:border-white/5 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {accountant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {accountant.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">Login:</span>
                          <span className="font-mono">{accountant.login}</span>
                        </div>
                        {accountant.telegramId && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="font-bold">Telegram ID:</span>
                            <span>{accountant.telegramId}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">Companies:</span>
                          <span>{accountant.companyCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(accountant)}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(accountant.id)}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

