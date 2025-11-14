import { NextResponse } from 'next/server';
import { getAllUsageRecords } from '@/lib/dynamodb';
import { calculateDashboardStats } from '@/lib/stats';
import { mockUsageData, isDemoMode } from '@/lib/mock-data';

export async function GET() {
  try {
    // Si está en modo demo, usar datos de prueba
    if (isDemoMode()) {
      console.log('🔧 Modo Demo: Usando datos de ejemplo');
      const stats = calculateDashboardStats(mockUsageData);
      
      return NextResponse.json({
        success: true,
        demo: true,
        data: {
          stats,
          records: mockUsageData,
        },
      });
    }

    // Modo producción: obtener datos de DynamoDB
    const records = await getAllUsageRecords();
    const stats = calculateDashboardStats(records);
    
    return NextResponse.json({
      success: true,
      demo: false,
      data: {
        stats,
        records,
      },
    });
  } catch (error) {
    console.error('Error en API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

