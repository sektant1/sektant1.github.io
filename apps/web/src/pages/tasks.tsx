import * as React from "react"
import { IconDotsVertical, IconTrash } from "@tabler/icons-react"
import { Link } from "react-router"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Empty, EmptyTitle } from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { Toggle } from "@workspace/ui/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { AREAS } from "@/data/topics"
import {
  seedTasks,
  STATE_LABEL,
  TASK_STATES,
  type Task,
  type TaskState,
} from "@/data/tasks"
import { useLocalState } from "@/lib/use-local-state"

// Fixed so "overdue" is stable in the fixtures rather than drifting with the
// real clock.
const TODAY = "2026-08-26"

type GroupBy = "state" | "area"

export function Tasks() {
  const [tasks, setTasks] = useLocalState<Task[]>("tasks", seedTasks)
  const [groupBy, setGroupBy] = React.useState<GroupBy>("state")
  const [overdueOnly, setOverdueOnly] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<Task | null>(null)

  const visible = overdueOnly ? tasks.filter((task) => isOverdue(task)) : tasks

  const groups: { key: string; label: string; items: Task[] }[] =
    groupBy === "state"
      ? TASK_STATES.map((state) => ({
          key: state,
          label: STATE_LABEL[state],
          items: visible.filter((task) => task.state === state),
        }))
      : AREAS.map((area) => ({
          key: area,
          label: area,
          items: visible.filter((task) => task.area === area),
        }))

  function setState(id: string, state: TaskState) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, state } : task))
    )
  }

  function remove(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <AsciiBanner text="TASKS" size="default" />
        <p className="max-w-prose text-xs leading-relaxed text-foreground/75">
          Your queue. Completion is stored in this browser only.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">
            Group
          </span>
          <ToggleGroup
            selectionMode="single"
            selectedKeys={[groupBy]}
            onSelectionChange={(keys) => {
              const next = [...keys][0]
              if (next === "state" || next === "area") setGroupBy(next)
            }}
          >
            <ToggleGroupItem id="state">State</ToggleGroupItem>
            <ToggleGroupItem id="area">Area</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Toggle isSelected={overdueOnly} onChange={setOverdueOnly} size="sm">
          Overdue only
        </Toggle>

        <span className="ms-auto font-mono text-[10px] tabular-nums opacity-60">
          {visible.length} of {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <TerminalFrame
            key={group.key}
            title={group.label}
            status={group.items.length ? "online" : "standby"}
            footer={`${group.items.length} tasks`}
          >
            {group.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Task</TableHead>
                    <TableHead className="w-28">Area</TableHead>
                    <TableHead className="w-28">Due</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((task) => (
                    <ContextMenuTrigger key={task.id}>
                      <TableRow>
                        <TableCell>
                          <Checkbox
                            aria-label={`Mark ${task.title} complete`}
                            isSelected={task.state === "done"}
                            onChange={(selected) =>
                              setState(task.id, selected ? "done" : "todo")
                            }
                          />
                        </TableCell>
                        <TableCell className="min-w-0">
                          <span
                            className={
                              task.state === "done"
                                ? "text-xs line-through opacity-50"
                                : "text-xs"
                            }
                          >
                            {task.linkedTopic ? (
                              <Link
                                to={`/topic/${task.linkedTopic}`}
                                className="hover:underline"
                              >
                                {task.title}
                              </Link>
                            ) : (
                              task.title
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {task.area}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">
                          {task.due ? (
                            isOverdue(task) ? (
                              <Badge
                                variant="destructive"
                                className="font-mono text-[10px]"
                              >
                                {task.due}
                              </Badge>
                            ) : (
                              <span className="opacity-70">{task.due}</span>
                            )
                          ) : (
                            <span className="opacity-30">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* The context menu is not reachable by keyboard or
                              touch, so the same actions get a real trigger. */}
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Actions for ${task.title}`}
                            >
                              <IconDotsVertical />
                            </Button>
                            <DropdownMenu>
                              {TASK_STATES.map((state) => (
                                <DropdownMenuItem
                                  key={state}
                                  onAction={() => setState(task.id, state)}
                                >
                                  Move to {STATE_LABEL[state]}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onAction={() => setPendingDelete(task)}
                              >
                                <IconTrash />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenu>
                          </DropdownMenuTrigger>
                        </TableCell>
                      </TableRow>

                      <ContextMenu>
                        {TASK_STATES.map((state) => (
                          <ContextMenuItem
                            key={state}
                            onAction={() => setState(task.id, state)}
                          >
                            Move to {STATE_LABEL[state]}
                          </ContextMenuItem>
                        ))}
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onAction={() => setPendingDelete(task)}
                        >
                          <IconTrash />
                          Delete
                        </ContextMenuItem>
                      </ContextMenu>
                    </ContextMenuTrigger>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="py-6">
                <EmptyTitle className="font-mono text-xs uppercase">
                  Nothing here
                </EmptyTitle>
              </Empty>
            )}
          </TerminalFrame>
        ))}
      </div>

      <AlertDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDelete?.title} will be removed from your queue. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onPress={() => {
              if (pendingDelete) remove(pendingDelete.id)
              setPendingDelete(null)
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  )
}

function isOverdue(task: Task) {
  return task.state !== "done" && task.due !== undefined && task.due < TODAY
}
