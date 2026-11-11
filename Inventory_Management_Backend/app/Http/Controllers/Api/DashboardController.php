<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sell;
use App\Models\Supplier;
use App\Models\Transaction;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard?low_stock_threshold=10
     * Returns every number the dashboard cards need, in one request.
     */
    public function index(Request $request)
    {
        try {
            $threshold = max(0, (int) $request->query('low_stock_threshold', 10));

            $now            = Carbon::now();
            $thisMonthStart = $now->copy()->startOfMonth();
            $lastMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();

            return response()->json([
                'products' => [
                    'total'          => Product::count(),
                    'new_this_month' => Product::where('created_at', '>=', $thisMonthStart)->count(),
                ],

                'low_stock' => [
                    'count'     => $this->lowStockCount($threshold),
                    'threshold' => $threshold,
                ],

                'suppliers' => [
                    'active'         => Supplier::where('status', true)->count(),
                    'new_this_month' => Supplier::where('created_at', '>=', $thisMonthStart)->count(),
                ],

                'transactions' => $this->monthlyFlow(Transaction::query(), null, $thisMonthStart, $lastMonthStart),
                'sales'        => $this->monthlyFlow(Sell::query(), 'total_amount', $thisMonthStart, $lastMonthStart),
                'expenses'     => $this->monthlyFlow(Expense::query(), 'cost', $thisMonthStart, $lastMonthStart),
            ]);
        } catch (Exception $e) {
            Log::error('Dashboard@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error fetching dashboard data'], 500);
        }
    }

    /**
     * Products whose available quantity is at or below the threshold.
     * Available = total purchased (stocks) - total sold (sell_items),
     * because the app does not decrement stock when a sale is made.
     */
    private function lowStockCount(int $threshold): int
    {
        return DB::table('products as p')
            ->leftJoin(
                DB::raw('(SELECT product_id, SUM(quantity) AS qty FROM stocks GROUP BY product_id) s'),
                's.product_id', '=', 'p.id'
            )
            ->leftJoin(
                DB::raw('(SELECT product_id, SUM(quantity) AS qty FROM sell_items GROUP BY product_id) si'),
                'si.product_id', '=', 'p.id'
            )
            ->where('p.status', true)
            ->whereRaw('COALESCE(s.qty, 0) - COALESCE(si.qty, 0) <= ?', [$threshold])
            ->count();
    }

    /**
     * Total, this month, last month and % change for a table.
     * $sumColumn = null  -> count rows
     * $sumColumn = 'x'   -> sum that column
     */
    private function monthlyFlow($query, ?string $sumColumn, Carbon $thisMonthStart, Carbon $lastMonthStart): array
    {
        $measure = function ($q) use ($sumColumn) {
            return $sumColumn ? (float) $q->sum($sumColumn) : (int) $q->count();
        };

        $total     = $measure(clone $query);
        $thisMonth = $measure((clone $query)->where('created_at', '>=', $thisMonthStart));
        $lastMonth = $measure(
            (clone $query)
                ->where('created_at', '>=', $lastMonthStart)
                ->where('created_at', '<', $thisMonthStart)
        );

        return [
            'total'          => $total,
            'this_month'     => $thisMonth,
            'last_month'     => $lastMonth,
            // null when last month has no data (cannot divide by zero)
            'change_percent' => $lastMonth > 0
                ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 1)
                : null,
        ];
    }
}