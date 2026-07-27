"use client";

import { MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatDate,
  formatTimeWindow,
  describeParameters,
  contractGroup,
  contractVolume,
} from "@/lib/format";
import { contractTypeLabel, contractCategory } from "@/lib/contract-types";
import type { Asset, Contract } from "@/lib/types";

export function ContractsTable({
  contracts,
  assets,
  onEdit,
  onRemove,
  emptyState,
}: {
  contracts: Contract[];
  assets: Asset[];
  onEdit: (c: Contract) => void;
  onRemove: (id: string) => void;
  emptyState?: React.ReactNode;
}) {
  const assetName = (id: string) => assets.find((a) => a.id === id)?.name ?? "-";

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Group</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Time Window</TableHead>
          <TableHead>Volume</TableHead>
          <TableHead>Parameters</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11}>
              {emptyState ?? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">No contracts yet</p>
                </div>
              )}
            </TableCell>
          </TableRow>
        ) : (
          contracts.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="font-medium">{c.name}</div>
                {c.subtitle && (
                  <div className="text-xs text-muted-foreground">{c.subtitle}</div>
                )}
              </TableCell>
              <TableCell>{assetName(c.assetId)}</TableCell>
              <TableCell>{contractGroup(c.parameters)}</TableCell>
              <TableCell>{contractCategory(c.type)}</TableCell>
              <TableCell>{contractTypeLabel(c.type)}</TableCell>
              <TableCell>{formatDate(c.startDate)}</TableCell>
              <TableCell>{formatDate(c.endDate)}</TableCell>
              <TableCell className="max-w-40 truncate">
                {formatTimeWindow(c.timeWindow)}
              </TableCell>
              <TableCell>{contractVolume(c.parameters)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono font-normal">
                  {describeParameters(c.parameters)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" aria-label="Row actions" />
                    }
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(c)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onRemove(c.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
