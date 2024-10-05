'use client'

import React, { useState } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Mock data for chatbots
const initialChatbots = [
  { id: 1, name: 'Customer Support Bot', description: 'Handles customer inquiries and support tickets', category: 'Support', commands: ['help', 'faq', 'ticket'], permissions: ['read_user_data', 'create_ticket'] },
  { id: 2, name: 'Sales Assistant', description: 'Helps with product recommendations and sales', category: 'Sales', commands: ['products', 'pricing', 'discount'], permissions: ['read_product_data', 'apply_discount'] },
  { id: 3, name: 'Appointment Scheduler', description: 'Books appointments and manages schedules', category: 'Scheduling', commands: ['book', 'cancel', 'reschedule'], permissions: ['read_calendar', 'write_calendar'] },
]

const availablePermissions = [
  'read_user_data',
  'write_user_data',
  'read_product_data',
  'write_product_data',
  'read_calendar',
  'write_calendar',
  'create_ticket',
  'apply_discount',
]

export default function ChatbotDashboard() {
  const [chatbots, setChatbots] = useState(initialChatbots)
  const [searchTerm, setSearchTerm] = useState('')
  const [newBot, setNewBot] = useState({ name: '', description: '', commands: [''], permissions: [] })

  const filteredChatbots = chatbots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e) => {
    setNewBot({ ...newBot, [e.target.name]: e.target.value })
  }

  const handleCommandChange = (index, value) => {
    const updatedCommands = [...newBot.commands]
    updatedCommands[index] = value
    setNewBot({ ...newBot, commands: updatedCommands })
  }

  const addCommand = () => {
    setNewBot({ ...newBot, commands: [...newBot.commands, ''] })
  }

  const removeCommand = (index) => {
    const updatedCommands = newBot.commands.filter((_, i) => i !== index)
    setNewBot({ ...newBot, commands: updatedCommands })
  }

  const handlePermissionChange = (value) => {
    setNewBot({ ...newBot, permissions: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newBotWithId = { ...newBot, id: chatbots.length + 1, category: 'Custom' }
    setChatbots([...chatbots, newBotWithId])
    setNewBot({ name: '', description: '', commands: [''], permissions: [] })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chatbot Automation Dashboard</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search chatbots..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Chatbots</h2>
          <div className="grid grid-cols-1 gap-4">
            {filteredChatbots.map(bot => (
              <Card key={bot.id}>
                <CardHeader>
                  <CardTitle>{bot.name}</CardTitle>
                  <CardDescription>{bot.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{bot.description}</p>
                  <p className="text-sm text-muted-foreground">Commands: {bot.commands.join(', ')}</p>
                  <p className="text-sm text-muted-foreground">Permissions: {bot.permissions.join(', ')}</p>
                </CardContent>
                <CardFooter>
                  <Button>Select Bot</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Chatbot</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Bot Name</Label>
              <Input
                id="name"
                name="name"
                value={newBot.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={newBot.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Commands</Label>
              {newBot.commands.map((command, index) => (
                <div key={index} className="flex items-center mt-2">
                  <Input
                    value={command}
                    onChange={(e) => handleCommandChange(index, e.target.value)}
                    placeholder={`Command ${index + 1}`}
                    className="mr-2"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeCommand(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="mt-2" onClick={addCommand}>
                <Plus className="h-4 w-4 mr-2" /> Add Command
              </Button>
            </div>
            <div>
              <Label htmlFor="permissions">Permissions</Label>
              <Select
                onValueChange={handlePermissionChange}
                value={newBot.permissions}
                multiple
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permissions" />
                </SelectTrigger>
                <SelectContent>
                  {availablePermissions.map((permission) => (
                    <SelectItem key={permission} value={permission}>
                      {permission}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Add Chatbot</Button>
          </form>
        </div>
      </div>
    </div>
  )
}